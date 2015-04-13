/*
 Local Storm Cell Detection for Pebble Time
 
 Copyright 2015 Christopher Zenzel.
 All Rights Reserved.
 */

#include <pebble.h>

// Window
Window *window;

// Text Layers
TextLayer *txt_cell_count;
TextLayer *txt_cell_info;
TextLayer *txt_radar_label;

// Bitmap and Image
GBitmap *weather_background_gb;
BitmapLayer *weather_background_bl;
	
// Key values for AppMessage Dictionary
enum {
  DETECTED_RADAR = 0,
  DETECTED_COUNT = 1,
  DETECTED_MILAGE = 2,
  DETECTED_HEADING = 3,
  DETECTED_FLAG = 4
};

// Storage Variables
static char str_detected_cells[128];
static char str_detected_distance[128];
static char str_detected_radar[128];

// Called when a message is received from PebbleKitJS
static void in_received_handler(DictionaryIterator *received, void *context) {
	Tuple *tuple;
  Tuple *loop_tuple_1;
  Tuple *loop_tuple_2;
	
	tuple = dict_find(received, DETECTED_RADAR);
	if(tuple) {
    snprintf(str_detected_radar, sizeof(str_detected_radar), "Storm Tracking for %s", tuple->value->cstring);
    text_layer_set_text(txt_radar_label, str_detected_radar);
		APP_LOG(APP_LOG_LEVEL_DEBUG, "Received Status: %d", (int)tuple->value->uint32); 
	}
	
	tuple = dict_find(received, DETECTED_FLAG);
	if(tuple) {
    int i_detected = (int)tuple->value->uint32;
    
    if (i_detected) {
      loop_tuple_1 = dict_find(received, DETECTED_COUNT);
      if (loop_tuple_1) {
        int i_cells_detected = (int)loop_tuple_1->value->uint32;
        snprintf(str_detected_cells, sizeof(str_detected_cells), "There are %d storm cells detected nearby", i_cells_detected);
        text_layer_set_text(txt_cell_count, str_detected_cells);
      }
      
      loop_tuple_1 = dict_find(received, DETECTED_MILAGE);
      loop_tuple_2 = dict_find(received, DETECTED_HEADING);
      if (loop_tuple_1 && loop_tuple_2) {
        int i_cells_milage = (int)loop_tuple_1->value->uint32;
        int i_cells_heading = (int)loop_tuple_2->value->uint32;
        snprintf(str_detected_distance, sizeof(str_detected_distance), "The closest storm cell is %d miles from you heading %d degrees", i_cells_milage, i_cells_heading);
        text_layer_set_text(txt_cell_info, str_detected_distance);
      }
    } else {
      // No storm cells are detected in your area
      text_layer_set_text(txt_cell_count, "No Storm Cells are Detected Nearby");
      text_layer_set_text(txt_cell_info, "Enjoy the view!");
    }
	}
}

// Called when an incoming message from PebbleKitJS is dropped
static void in_dropped_handler(AppMessageResult reason, void *context) {	
}

// Called when PebbleKitJS does not acknowledge receipt of a message
static void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
}

// Initalize the watch application interface
void init(void) {
  // Create the window
	window = window_create();
  
  // Create the text layers

  // Text Layer: Title
  txt_radar_label = text_layer_create(GRect(0, 20, 144, 60));
  text_layer_set_text_alignment(txt_radar_label, GTextAlignmentCenter);
  text_layer_set_font(txt_radar_label, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  text_layer_set_background_color(txt_radar_label, GColorClear);
  text_layer_set_text_color(txt_radar_label, GColorBlack);
  text_layer_set_text(txt_radar_label, "Loading Storm Tracks...");

  // Text Layer: Cell Count
  txt_cell_count = text_layer_create(GRect(0, 60, 144, 45));
  text_layer_set_text_alignment(txt_cell_count, GTextAlignmentCenter);
  text_layer_set_font(txt_cell_count, fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD));
  text_layer_set_background_color(txt_cell_count, GColorClear);
  text_layer_set_text_color(txt_cell_count, GColorBlack);

  // Text Layer: Cell Distance and Heading
  txt_cell_info = text_layer_create(GRect(0, 90, 144, 60));
  text_layer_set_text_alignment(txt_cell_info, GTextAlignmentCenter);
  text_layer_set_font(txt_cell_info, fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD));
  text_layer_set_background_color(txt_cell_info, GColorClear);
  text_layer_set_text_color(txt_cell_info, GColorBlack);
  
  // Imge Layer
  weather_background_gb = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_WX_CLOUDS);
  weather_background_bl = bitmap_layer_create(GRect(0, 0, 144, 168));
  bitmap_layer_set_bitmap(weather_background_bl, weather_background_gb);
  
  // Add Image Layers
  layer_add_child(window_get_root_layer(window), bitmap_layer_get_layer(weather_background_bl));

  // Add the layers, bitmap first, then text
  layer_add_child(window_get_root_layer(window), text_layer_get_layer(txt_cell_count));
  layer_add_child(window_get_root_layer(window), text_layer_get_layer(txt_cell_info));
  layer_add_child(window_get_root_layer(window), text_layer_get_layer(txt_radar_label));
  
  // Push window stack and layers
	window_stack_push(window, true);
	
	// Register AppMessage handlers
	app_message_register_inbox_received(in_received_handler); 
	app_message_register_inbox_dropped(in_dropped_handler); 
	app_message_register_outbox_failed(out_failed_handler);
	app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());
}

// De-initalize the watch application
void deinit(void) {
	gbitmap_destroy(weather_background_gb);
	bitmap_layer_destroy(weather_background_bl);
	text_layer_destroy(txt_cell_info);
	text_layer_destroy(txt_cell_count);
	text_layer_destroy(txt_radar_label);
	app_message_deregister_callbacks();
	window_destroy(window);
}

// Main function to the watch application
int main( void ) {
	init();
	app_event_loop();
	deinit();
}
