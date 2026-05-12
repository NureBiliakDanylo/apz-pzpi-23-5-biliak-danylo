package com.example.iothub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.example.iothub.R
import com.example.iothub.data.model.Sensor
import com.example.iothub.ui.viewmodel.IoTHubViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SensorListScreen(
    viewModel: IoTHubViewModel,
    onSensorClick: (String) -> Unit,
    onSettingsClick: () -> Unit
) {
    val favoriteSensors by viewModel.sensors.collectAsState()
    val allSensors by viewModel.allSensors.collectAsState()
    val favoriteIds by viewModel.favoriteSensorIds.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var showOnlyFavorites by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (showOnlyFavorites) stringResource(R.string.your_sensors) else stringResource(R.string.all_available_sensors)) },
                actions = {
                    IconButton(onClick = { viewModel.refreshSensors() }) {
                        Icon(Icons.Filled.Refresh, contentDescription = stringResource(R.string.refresh))
                    }
                    IconButton(onClick = onSettingsClick) {
                        Icon(Icons.Filled.Settings, contentDescription = stringResource(R.string.settings))
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(selectedTabIndex = if (showOnlyFavorites) 0 else 1) {
                Tab(
                    selected = showOnlyFavorites,
                    onClick = { showOnlyFavorites = true },
                    text = { Text(stringResource(R.string.my_sensors_tab)) }
                )
                Tab(
                    selected = !showOnlyFavorites,
                    onClick = { showOnlyFavorites = false },
                    text = { Text(stringResource(R.string.discovery_tab)) }
                )
            }

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text(stringResource(R.string.search_placeholder)) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear search")
                        }
                    }
                },
                singleLine = true,
                shape = MaterialTheme.shapes.medium
            )

            if (isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            if (errorMessage != null) {
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp)
                )
            }

            val displayList = (if (showOnlyFavorites) favoriteSensors else allSensors)
                .filter {
                    it.name.contains(searchQuery, ignoreCase = true) ||
                    it.location.contains(searchQuery, ignoreCase = true)
                }

            if (displayList.isEmpty() && !isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        if (searchQuery.isNotEmpty()) stringResource(R.string.no_sensors_match)
                        else if (showOnlyFavorites) stringResource(R.string.no_sensors_saved)
                        else stringResource(R.string.no_sensors_found)
                    )
                }
            }

            LazyColumn {
                items(displayList) { sensor ->
                    SensorItem(
                        sensor = sensor,
                        isFavorite = favoriteIds.contains(sensor.id),
                        onClick = { onSensorClick(sensor.id) },
                        onToggleFavorite = { viewModel.toggleFavorite(sensor.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun SensorItem(
    sensor: Sensor,
    isFavorite: Boolean,
    onClick: () -> Unit,
    onToggleFavorite: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = sensor.name, style = MaterialTheme.typography.titleMedium)
                Text(text = sensor.location, style = MaterialTheme.typography.bodyMedium)
                sensor.lastSeenAt?.let {
                    Text(text = stringResource(R.string.last_seen, it), style = MaterialTheme.typography.bodySmall)
                }
            }
            IconButton(onClick = onToggleFavorite) {
                Icon(
                    imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                    contentDescription = if (isFavorite) "Remove from favorites" else "Add to favorites",
                    tint = if (isFavorite) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
