# Proguard rules for Omuto Central TWA

-keep class androidx.** { *; }
-keep class com.google.androidbrowserhelper.** { *; }

-keepattributes *
-keepattributes Signature
-keepattributes InnerClasses

-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*

-allowaccessmodification
-repackageclasses ''
