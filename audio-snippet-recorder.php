<?php
/**
 * Plugin Name: Audio Snippet Recorder
 */

function snippets_shortcode($atts = [], $content = null, $tag = '') {
   $o = '';
   $o .= '<h2>Audio Snippet Recorder</h2>';
   return $o;
}

function snippets_shortcodes_init() {
   add_shortcode('snippets', 'snippets_shortcode');
}

add_action('init', 'snippets_shortcodes_init');