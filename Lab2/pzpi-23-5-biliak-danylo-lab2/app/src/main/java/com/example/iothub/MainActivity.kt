package com.example.iothub

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewScreenSizes
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.iothub.ui.screens.SensorDetailScreen
import com.example.iothub.ui.screens.SensorListScreen
import com.example.iothub.ui.screens.SettingsScreen
import com.example.iothub.ui.screens.SetupScreen
import com.example.iothub.ui.theme.IoTHubTheme
import com.example.iothub.ui.viewmodel.IoTHubViewModel

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val viewModel: IoTHubViewModel = viewModel()
            val language by viewModel.language.collectAsState()

            LaunchedEffect(language) {
                val appLocale: LocaleListCompat = LocaleListCompat.forLanguageTags(language)
                AppCompatDelegate.setApplicationLocales(appLocale)
            }

            IoTHubTheme {
                IoTHubApp(viewModel)
            }
        }
    }
}

@PreviewScreenSizes
@Composable
fun IoTHubApp(viewModel: IoTHubViewModel) {
    var selectedSensorId by rememberSaveable { mutableStateOf<String?>(null) }
    var isSettingsVisible by rememberSaveable { mutableStateOf(false) }
    val serverUrl by viewModel.serverUrl.collectAsState()

    Box(modifier = Modifier.fillMaxSize()) {
        if (serverUrl == null) {
            SetupScreen(viewModel = viewModel)
        } else if (isSettingsVisible) {
            SettingsScreen(
                viewModel = viewModel,
                onBack = { isSettingsVisible = false }
            )
        } else if (selectedSensorId == null) {
            SensorListScreen(
                viewModel = viewModel,
                onSensorClick = { selectedSensorId = it },
                onSettingsClick = { isSettingsVisible = true }
            )
        } else {
            SensorDetailScreen(
                sensorId = selectedSensorId!!,
                viewModel = viewModel,
                onBack = { selectedSensorId = null }
            )
        }
    }
}
