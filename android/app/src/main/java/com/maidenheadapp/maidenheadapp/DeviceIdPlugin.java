package com.maidenheadapp.maidenheadapp;

import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// A lasting id for this phone (src/mobile/lib/pushSubscribe.js). Reinstalling
// the app gives it a new notification address; with this id the push list
// replaces the phone's old address instead of counting the phone twice.
// Android's own per-app id: the same after a reinstall, different for every
// app and phone, and reset only by a factory reset.
@CapacitorPlugin(name = "DeviceId")
public class DeviceIdPlugin extends Plugin {
    @PluginMethod
    public void get(PluginCall call) {
        String id = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ANDROID_ID);
        JSObject result = new JSObject();
        result.put("id", id == null || id.isEmpty() ? JSObject.NULL : "a-" + id);
        call.resolve(result);
    }
}
