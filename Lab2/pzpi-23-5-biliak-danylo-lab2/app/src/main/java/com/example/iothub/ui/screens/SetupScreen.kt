package com.example.iothub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.iothub.R
import com.example.iothub.ui.viewmodel.IoTHubViewModel

@Composable
fun SetupScreen(viewModel: IoTHubViewModel) {
    var url by remember { mutableStateOf("") }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = stringResource(R.string.welcome),
                style = MaterialTheme.typography.headlineMedium,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.setup_instruction),
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(32.dp))
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text(stringResource(R.string.server_url) + " (e.g. 192.168.1.10:3000)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = { viewModel.saveServerUrl(url) },
                modifier = Modifier.fillMaxWidth(),
                enabled = url.isNotBlank()
            ) {
                Text(stringResource(R.string.connect))
            }
        }
    }
}
