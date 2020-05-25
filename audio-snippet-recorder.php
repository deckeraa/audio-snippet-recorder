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
   $o .= '<p>' . esc_html__($snippets_atts['text'], 'snippets') . '</p>';
   $o .= "<button onClick='alert(testScript);'>Record snippet</button>";
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
}
add_action('wp_enqueue_scripts', 'snippets_enqueue');