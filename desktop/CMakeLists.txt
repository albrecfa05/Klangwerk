cmake_minimum_required(VERSION 3.22)
project(KlangwerkDesktop VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
# Statische MSVC-Laufzeit: die .exe läuft ohne extra Visual-C++-Installation
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")

# JUCE: lokal per -DJUCE_DIR=/pfad/zu/JUCE, sonst automatisch von GitHub (Version fest)
if(JUCE_DIR)
    add_subdirectory(${JUCE_DIR} juce)
else()
    include(FetchContent)
    FetchContent_Declare(juce
        GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
        GIT_TAG 9.0.6
        GIT_SHALLOW TRUE)
    FetchContent_MakeAvailable(juce)
endif()

juce_add_gui_app(Klangwerk
    PRODUCT_NAME "Klangwerk"
    COMPANY_NAME "Klangwerk"
    BUNDLE_ID "de.klangwerk.desktop"
    VERSION ${PROJECT_VERSION}
    NEEDS_WEB_BROWSER TRUE
    NEEDS_WEBVIEW2 TRUE)

# Die Weboberfläche (dieselben Dateien wie auf GitHub Pages) wird in die .exe eingebettet
juce_add_binary_data(KlangwerkWeb
    HEADER_NAME KlangwerkWeb.h
    NAMESPACE KlangwerkWeb
    SOURCES
        ${CMAKE_CURRENT_SOURCE_DIR}/../index.html
        ${CMAKE_CURRENT_SOURCE_DIR}/../css/klangwerk.css
        ${CMAKE_CURRENT_SOURCE_DIR}/../js/worklets.js
        ${CMAKE_CURRENT_SOURCE_DIR}/../js/desktop.js
        ${CMAKE_CURRENT_SOURCE_DIR}/../js/app.js)

target_sources(Klangwerk PRIVATE Source/Main.cpp)

target_compile_definitions(Klangwerk PRIVATE
    JUCE_USE_CURL=0
    JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
    JUCE_PLUGINHOST_VST3=1
    JUCE_PLUGINHOST_AU=0
    JUCE_PLUGINHOST_LADSPA=0
    JUCE_PLUGINHOST_LV2=0
    JUCE_APPLICATION_NAME_STRING="$<TARGET_PROPERTY:Klangwerk,JUCE_PRODUCT_NAME>"
    JUCE_APPLICATION_VERSION_STRING="$<TARGET_PROPERTY:Klangwerk,JUCE_VERSION>")

target_link_libraries(Klangwerk PRIVATE
    KlangwerkWeb
    juce::juce_gui_extra
    juce::juce_audio_utils
    juce::juce_audio_processors
    juce::juce_audio_devices
    PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_warning_flags)
