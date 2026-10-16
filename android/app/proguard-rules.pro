# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo Modules v2 runtime.
# expo-module-gradle-plugin does not ship consumer ProGuard rules, so without
# these R8 renames/strips the JS-facing @JS members and their generated
# __trampoline$ExpoModulesV2 methods, and calls from JS fail at runtime with
# NoSuchMethodError (e.g. SQLiteModule.ensureDatabasePathExistsAsync).
# Mirrors node_modules/expo-modules-core/android/proguard-rules.pro.
-keep class expo.modules.ExpoModulesV2ModuleList { public <init>(); }
-keep class * extends io.github.expo.modules.v2.Module {
  <init>();
  static ** INSTANCE;
}
# The v2 C++ runtime reaches these through JNI.
-keep class io.github.expo.kolibri.** { *; }
-keep class io.github.expo.modules.v2.** { *; }
# JNI calls exported members and generated trampolines by name.
-keepclassmembers class * {
  @io.github.expo.modules.v2.JS *;
  @io.github.expo.modules.v2.Constant *;
  @io.github.expo.modules.v2.Event *;
  *** *$ExpoModulesV2(...);
  static ** *$ExpoModulesV2;
}
-keep class **$ExpoModulesV2 { <init>(); }
-keepclassmembers class * extends io.github.expo.modules.v2.Module { public *; }
-keepclassmembers class * extends io.github.expo.modules.v2.SharedObject { public *; }
# EnumConverter reads enum fields by reflection; v2 enums have no marker type.
-if class **.* extends io.github.expo.modules.v2.Module
-keepclassmembers,allowobfuscation enum <1>.** { !static <fields>; }
-if class **.* extends io.github.expo.modules.v2.SharedObject
-keepclassmembers,allowobfuscation enum <1>.** { !static <fields>; }

# Add any project specific keep options here:
