package com.example.iothub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.iothub.R
import com.example.iothub.ui.viewmodel.IoTHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: IoTHubViewModel, onBack: () -> Unit) {
    val currentUrl by viewModel.serverUrl.collectAsState()
    val defaultHours by viewModel.defaultHoursAhead.collectAsState()
    val currentLanguage by viewModel.language.collectAsState()
    val currentTempUnit by viewModel.tempUnit.collectAsState()
    
    var url by remember { mutableStateOf(currentUrl ?: "") }
    var hoursAhead by remember { mutableStateOf(defaultHours.toString()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = stringResource(R.string.configure_hub),
                    style = MaterialTheme.typography.headlineSmall,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(32.dp))
                
                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text(stringResource(R.string.server_url)) },
                    placeholder = { Text("e.g. 192.168.1.10:3000") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = hoursAhead,
                    onValueChange = { if (it.isEmpty() || it.all { char -> char.isDigit() }) hoursAhead = it },
                    label = { Text(stringResource(R.string.default_forecast_hours)) },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Language Selector
                Text(text = stringResource(R.string.language), style = MaterialTheme.typography.labelMedium)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    FilterChip(
                        selected = currentLanguage == "en",
                        onClick = { viewModel.saveLanguage("en") },
                        label = { Text("English") },
                        modifier = Modifier.padding(4.dp)
                    )
                    FilterChip(
                        selected = currentLanguage == "uk",
                        onClick = { viewModel.saveLanguage("uk") },
                        label = { Text("Українська") },
                        modifier = Modifier.padding(4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Temp Unit Selector
                Text(text = stringResource(R.string.temperature_unit), style = MaterialTheme.typography.labelMedium)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    listOf("C", "F", "K").forEach { unit ->
                        FilterChip(
                            selected = currentTempUnit == unit,
                            onClick = { viewModel.saveTempUnit(unit) },
                            label = { Text(when(unit) { "C" -> "°C"; "F" -> "°F"; else -> "K" }) },
                            modifier = Modifier.padding(4.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                Button(
                    onClick = {
                        viewModel.saveServerUrl(url)
                        val hours = hoursAhead.toIntOrNull() ?: 1
                        viewModel.saveDefaultHoursAhead(hours)
                        onBack()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = url.isNotBlank() && hoursAhead.isNotBlank()
                ) {
                    Text(stringResource(R.string.save_settings))
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(
                    onClick = {
                        viewModel.clearServerUrl()
                        onBack()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text(stringResource(R.string.reset_connection))
                }
            }
        }
    }
}
