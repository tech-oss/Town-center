package com.maidenheadapp.maidenheadapp;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Maidenhead's own plugin (DeviceIdPlugin.java), before the web view starts.
        registerPlugin(DeviceIdPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
