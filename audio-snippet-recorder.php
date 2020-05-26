<?php
/**
 * Plugin Name: Audio Snippet Recorder
 */

function get_table_name () {
   global $wpdb;
   $table_name = $wpdb->prefix . "snippets";
}

function snippet_install () {
   global $wpdb;

   $table_name = get_table_name();
   $charset_collate = $wpdb->get_charset_collate();

   $sql = "CREATE TABLE $table_name (
      id mediumint(9) NOT NULL AUTO_INCREMENT,
      snippet varchar(255) DEFAULT '' NOT NULL,
      PRIMARY KEY  (id)
   ) $charset_collate;";

   require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
   dbDelta($sql);
}
register_activation_hook(__FILE__, 'snippet_install');

function snippets_shortcode($atts = [], $content = null, $tag = '') {
   // normalize attribute keys, lowercase
   $atts = array_change_key_case((array)$atts, CASE_LOWER);

   // override default attributes with user attributes
   $snippets_atts = shortcode_atts([
                                        'text' => 'Text snippet goes here',
                                 ], $atts, $tag);



   $o = '';
   $o .= '<div class=snippet>';
   $o .= '<p class="snippet-text">' . esc_html__($snippets_atts['text'], 'snippets') . '</p>';
   $o .= "<button onClick='testScript(event);'>Record snippet</button>";
   $o .= '<button class="stop">Stop</button>';
   $o .= '<div class="clip-container"></div>';
   $o .= '</div>';
   return $o;
}

function snippets_shortcodes_init() {
   add_shortcode('snippets', 'snippets_shortcode');
}

add_action('init', 'snippets_shortcodes_init');

function snippets_enqueue( $hook ) {
   // if( 'audio-snippet-recorder.php' != $hook ) return;
   wp_enqueue_script('snippets-script',
                     plugins_url( '/snippets.js', __FILE__ )
                     , array('jquery'));
   wp_localize_script('snippets-script','my_ajax_obj', array(
      'ajax_url' => admin_url( 'admin-ajax.php' ),
      'nonce'    => wp_create_nonce( 'clip_nonce' ),
      'post_id'  => get_the_ID()
   ));
}
add_action('wp_enqueue_scripts', 'snippets_enqueue');

function upload_snippet_handler() {
   // TODO check nonce

   require_once( ABSPATH . 'wp-admin/includes/image.php' );
   require_once( ABSPATH . 'wp-admin/includes/file.php' );
   require_once( ABSPATH . 'wp-admin/includes/media.php' );

   define( 'ALLOW_UNFILTERED_UPLOADS', true ); // TODO remove before shipping

   $attachment_id = media_handle_upload( 'snippet_blob', $_POST['post_id'], $_POST['snippet_blob']);
   $attachment = wp_prepare_attachment_for_js( $attachment_id );

   $return = array('Success' => 'true',
                   'Title' => $_POST['title'],
                   'attachment_id' => $attachment_id,
                   'attachment' => $attachment,
                   'post' => $_POST['post_id']);
   wp_send_json($return);
}
add_action( 'wp_ajax_upload_snippet', 'upload_snippet_handler' );
add_action( 'wp_ajax_nopriv_upload_snippet', 'upload_snippet_handler' );