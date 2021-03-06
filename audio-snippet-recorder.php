<?php
/**
 * Plugin Name: Snippets: the Audio Snippet Recorder
 * Plugin URI: https://github.com/deckeraa/audio-snippet-recorder
 * Description: Let contributers record audio snippets.
 * Author: Aaron Decker
 * Author URI: https://stronganchortech.com/
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 */

add_action( 'wp_enqueue_scripts', 'enqueue_load_fa' );
function enqueue_load_fa() {
    wp_enqueue_style( 'load-fa', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css' );
}

function get_table_name () {
    global $wpdb;
    return $wpdb->prefix . "snippets"; // typically returns wp_snippets
}

function snippet_install () {
    global $wpdb;

    $table_name = get_table_name();
    $charset_collate = $wpdb->get_charset_collate();

    // audio_attachment_id is not a foreign key because dbDelta doesn't support that
    // same with user_id
    $sql = "CREATE TABLE $table_name (
      id mediumint(9) NOT NULL AUTO_INCREMENT,
      snippet varchar(255) DEFAULT '' NOT NULL,
      audio_attachment_id bigint(20) NOT NULL,
      user_id bigint(20) NOT NULL,
      user_display_name varchar(250) NOT NULL,
      PRIMARY KEY  (id)
   ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    // Configure plugin-specific Capabilities
    // Contributors and above can record snippets
    global $wp_roles;
    $wp_roles->add_cap( "administrator", "record_snippets" );
    $wp_roles->add_cap( "editor", "record_snippets" );
    $wp_roles->add_cap( "author", "record_snippets" );
    $wp_roles->add_cap( "contributor", "record_snippets" );
    $wp_roles->add_cap( "administrator", "delete_others_snippets" ); 
}
register_activation_hook(__FILE__, 'snippet_install');

function snippets_shortcode($atts = [], $content = null, $tag = '') {
    // normalize attribute keys, lowercase
    $atts = array_change_key_case((array)$atts, CASE_LOWER);

    // override default attributes with user attributes
    $snippets_atts = shortcode_atts([
        'text' => $content,
    ], $atts, $tag);

    // look up existing snippet recordings
    $text = $snippets_atts['text'];
    global $wpdb;
    $table_name = get_table_name();
    $snippets = $wpdb->get_results(
        "
      SELECT * FROM $table_name
      where snippet='$text';
        "
    );

    // render the snippet with the existing snippet recordings
    $o = '';
    $o .= '<div class="snippet flex flex-column ma2">';
    $o .= '<div class="flex items-center">';
    if ($content != null) {
        $o .= do_shortcode($content);
        $o .= '<p class="snippet-text dn">' . esc_html__($snippets_atts['text'], 'snippets') . '</p>';
    }
    else {
        $o .= '<p class="snippet-text">' . esc_html__($snippets_atts['text'], 'snippets') . '</p>';
    }

    if ( current_user_can("record_snippets") ) {
        $o .= '<button class="start white b bg-green f3 ba br3 ma1 dim" onClick="recordSnippet(event);"><i class="fa fa-microphone"></i>
</button>';
        $o .= '<button class="stop white b bg-red f3 ba br3 ma1 dim dn"><i class="fa fa-stop"></i></button>';
    }
    $o .= '</div>';
    $o .= '<div class="clip-container">';
    foreach( $snippets as $snippet ) {
        $o .= '<div class="flex">';
        $o .= '<audio controls="" src="' . wp_get_attachment_url($snippet->audio_attachment_id) . '"></audio></audio>';
        $user = wp_get_current_user();
        if ( current_user_can("delete_others_snippets") || $user->id == $snippet->user_id ) {
            $o .= '<button class="white b bg-red f3 ba br3 ma1 dim" onclick="deleteSnippet(event,' . $snippet->id . ');">x</button>';
        }
        $o .= '</div>';
    }
    $o .= '</div>';
    $o .= '</div>';
    return $o;
}

function snippets_shortcodes_init() {
    add_shortcode('snippets', 'snippets_shortcode');
}

add_action('init', 'snippets_shortcodes_init');

function snippets_enqueue( $hook ) {
    wp_enqueue_script('snippets-script',
                      plugins_url( '/snippets.js', __FILE__ )
                    , array('jquery'));
    wp_localize_script('snippets-script','my_ajax_obj', array(
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'clip_nonce' ),
        'post_id'  => get_the_ID()
    ));
    // we use Tachyons for styling. https://tachyons.io/
    wp_enqueue_style('snippets-style', plugins_url('/tachyons.min.css', __FILE__ ));
}
add_action('wp_enqueue_scripts', 'snippets_enqueue');

function upload_snippet_handler() {
    check_ajax_referer('clip_nonce');

    if ( !current_user_can("record_snippets") ) {
        wp_send_json(array('Success' => 'false', 'error_message' => 'Insufficent permissions. You need the contributor role or above.'));
        wp_die(); // this is a bit redundant since wp_send_json calls wp_die(), but putting it in just in case wp_send_json changes to stop doing that
    }

    // save the audio as a post attachment
    require_once( ABSPATH . 'wp-admin/includes/image.php' );
    require_once( ABSPATH . 'wp-admin/includes/file.php' );
    require_once( ABSPATH . 'wp-admin/includes/media.php' );

    define( 'ALLOW_UNFILTERED_UPLOADS', true ); // TODO remove before shipping

    // upload the audio to an attachment attached to the post that the shortcode is on
    $attachment_id = media_handle_upload( 'snippet_blob', $_POST['post_id'], $_POST['snippet_blob']);
    $attachment = wp_prepare_attachment_for_js( $attachment_id );

    // add a line to the wp_snippets table so that we can find these later when the snippet shortcode is used
    global $wpdb;
    $table_name = get_table_name();
    $user = wp_get_current_user();
    $wpdb->insert(
        $table_name,
        array(
            snippet => $_POST['snippet'],
            audio_attachment_id => $attachment_id,
            user_id => $user->id,
            user_display_name => $user->display_name,
        )
    );
    // Grab the ID of the row just inserted. This needs to be
    // passed back to the client so that it can render a working delete button.
    $snippet = $wpdb->get_row(
        "
      SELECT * FROM $table_name
      where audio_attachment_id=$attachment_id;
        "
    );

    $return = array('Success' => 'true',
                    'Title' => $_POST['title'],
                    'attachment_id' => $attachment_id,
                    'attachment' => $attachment,
                    'post' => $_POST['post_id'],
                    'snippet_id' => $snippet->id);
    wp_send_json($return);
}
add_action( 'wp_ajax_upload_snippet', 'upload_snippet_handler' );
add_action( 'wp_ajax_nopriv_upload_snippet', 'upload_snippet_handler' );

function delete_snippet_handler() {
    check_ajax_referer('clip_nonce');
    global $wpdb;
    $snippet_id = $_POST['snippet_id'];

    // look up the snippet since we need to know the user_id and the attachment containing the media
    $table_name = get_table_name();
    $snippet = $wpdb->get_row(
        "
      SELECT * FROM $table_name
      where id=$snippet_id;
        "
    );

    $user = wp_get_current_user();
    if ( current_user_can("delete_others_snippets") || $user->id == $snippet->user_id ) {
        // Delete the snippet
        $table_name = get_table_name();
        $wpdb->delete(
            $table_name,
            array( 'id' => $snippet_id )
        );

        // Delete the underlying post
        $wpdb->delete(
            $wpdb->prefix . "posts",
            array( 'id' => $snippet->audio_attachment_id )
        );
        
        $return = array('Success' => 'true',
                        'snippet_id' => $snippet->id,
                        'audio_attachment_id' => $snippet->audio_attachment_id);
        wp_send_json($return);
    }
    else {
        wp_send_json(array('Success' => 'false', 'error_message' => "Insufficent permissions. You can only delete other users' snippets if you are an admin."));
    }
}
add_action( 'wp_ajax_delete_snippet', 'delete_snippet_handler' );
add_action( 'wp_ajax_nopriv_delete_snippet', 'delete_snippet_handler' );
