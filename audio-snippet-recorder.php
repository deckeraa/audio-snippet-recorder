<?php
/**
 * Plugin Name: Audio Snippet Recorder
 */

function snippets_shortcode($atts = [], $content = null, $tag = '') {
   // normalize attribute keys, lowercase
   $atts = array_change_key_case((array)$atts, CASE_LOWER);

   // override default attributes with user attributes
   $snippets_atts = shortcode_atts([
                                        'text' => 'Text snippet goes here',
                                 ], $atts, $tag);

   $o = '';
   $o .= '<div class=snippet>';
   $o .= '<p>' . esc_html__($snippets_atts['text'], 'snippets') . '</p>';
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
                     plugins_url( '/snippets.js', __FILE__ ));
   wp_localize_script('snippets-script','my_ajax_obj', array(
      'ajax_url' => admin_url( 'admin-ajax.php' ),
      'nonce'    => wp_create_nonce( 'clip_nonce' ),
   ));
}
add_action('wp_enqueue_scripts', 'snippets_enqueue');