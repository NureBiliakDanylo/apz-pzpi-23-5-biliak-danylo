package com.example.iothub.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import com.example.iothub.R
import com.example.iothub.data.model.SensorReading
import com.example.iothub.ui.viewmodel.IoTHubViewModel
import com.example.iothub.utils.TemperatureUtils
import com.patrykandpatrick.vico.compose.cartesian.CartesianChartHost
import com.patrykandpatrick.vico.compose.cartesian.axis.rememberBottomAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.rememberStartAxis
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLine
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLineCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.rememberCartesianChart
import com.patrykandpatrick.vico.compose.common.fill
import com.patrykandpatrick.vico.core.cartesian.data.CartesianChartModelProducer
import com.patrykandpatrick.vico.core.cartesian.data.lineSeries
import com.patrykandpatrick.vico.core.cartesian.layer.LineCartesianLayer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SensorDetailScreen(
    sensorId: String,
    viewModel: IoTHubViewModel,
    onBack: () -> Unit
) {
    val readings by viewModel.readings.collectAsState()
    val forecast by viewModel.forecast.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val defaultHours by viewModel.defaultHoursAhead.collectAsState()
    val tempUnit by viewModel.tempUnit.collectAsState()

    var hoursAhead by remember { mutableStateOf(defaultHours) }
    var hoursInput by remember { mutableStateOf(defaultHours.toString()) }
    
    val isHoursValid = remember(hoursInput) {
        val h = hoursInput.toIntOrNull()
        h != null && h in 1..24
    }

    LaunchedEffect(defaultHours) {
        hoursInput = defaultHours.toString()
        hoursAhead = defaultHours
    }
    
    LaunchedEffect(hoursInput) {
        val h = hoursInput.toIntOrNull()
        if (h != null && h in 1..24) {
            hoursAhead = h
        }
    }

    val tempModelProducer = remember { CartesianChartModelProducer() }
    val humidityModelProducer = remember { CartesianChartModelProducer() }
    val pressureModelProducer = remember { CartesianChartModelProducer() }

    LaunchedEffect(sensorId) {
        viewModel.fetchReadings(sensorId)
    }

    LaunchedEffect(sensorId, hoursAhead) {
        viewModel.fetchForecast(sensorId, hoursAhead)
    }

    LaunchedEffect(readings, tempUnit) {
        if (readings.isNotEmpty()) {
            val chronReadings = readings.reversed()
            tempModelProducer.runTransaction {
                lineSeries { series(chronReadings.map { TemperatureUtils.convert(it.temperature, tempUnit) }) }
            }
            humidityModelProducer.runTransaction {
                lineSeries { series(chronReadings.map { it.humidity }) }
            }
            pressureModelProducer.runTransaction {
                lineSeries { series(chronReadings.map { it.pressure }) }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.sensor_analytics)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                actions = {
                    IconButton(onClick = {
                        viewModel.fetchReadings(sensorId)
                        viewModel.fetchForecast(sensorId, hoursAhead)
                    }) {
                        Icon(Icons.Filled.Refresh, contentDescription = stringResource(R.string.refresh))
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding).fillMaxSize()) {
            item {
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
            }

            // Latest Reading Card
            item {
                readings.firstOrNull()?.let { latest ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(stringResource(R.string.current_conditions), style = MaterialTheme.typography.titleMedium)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                WeatherStat(label = stringResource(R.string.temp), value = TemperatureUtils.format(latest.temperature, tempUnit))
                                WeatherStat(label = stringResource(R.string.humidity), value = "${latest.humidity}%")
                                WeatherStat(label = stringResource(R.string.pressure), value = "${latest.pressure} hPa")
                            }
                        }
                    }
                }
            }

            // Forecast Card
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = stringResource(R.string.forecast), style = MaterialTheme.typography.titleMedium)
                            
                            // Hours selector
                            OutlinedTextField(
                                value = hoursInput,
                                onValueChange = { 
                                    if (it.isEmpty() || it.all { char -> char.isDigit() }) hoursInput = it 
                                },
                                label = { Text(stringResource(R.string.period_label)) },
                                modifier = Modifier.width(120.dp),
                                isError = !isHoursValid,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                textStyle = MaterialTheme.typography.bodySmall
                            )
                        }
                        
                        if (forecast != null) {
                            forecast?.let {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = stringResource(R.string.predicted_temp, TemperatureUtils.format(it.predictedTemp, tempUnit)))
                                Text(text = stringResource(R.string.predicted_humidity, it.predictedHumidity.toInt()))
                                Text(text = stringResource(R.string.predicted_pressure, it.predictedPressure.toInt()))
                                it.note?.let { note ->
                                    Text(text = stringResource(R.string.note, note), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                                }
                            }
                        } else if (!isLoading) {
                            Text(
                                text = stringResource(R.string.no_forecast),
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }
                    }
                }
            }

            // Temperature Chart
            item {
                val unitLabel = when(tempUnit) { "F" -> "°F"; "K" -> "K"; else -> "°C" }
                ChartCard(title = stringResource(R.string.temp_trend, unitLabel), modelProducer = tempModelProducer, color = Color.Red)
            }

            // Humidity Chart
            item {
                ChartCard(title = stringResource(R.string.humidity_trend), modelProducer = humidityModelProducer, color = Color.Blue)
            }

            // Pressure Chart
            item {
                ChartCard(title = stringResource(R.string.pressure_trend), modelProducer = pressureModelProducer, color = Color.Green)
            }

            item {
                Text(
                    text = stringResource(R.string.recent_history),
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(16.dp)
                )
            }

            items(readings) { reading ->
                ReadingItem(reading, tempUnit)
            }
        }
    }
}

@Composable
fun WeatherStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelMedium)
        Text(text = value, style = MaterialTheme.typography.titleLarge)
    }
}

@Composable
fun ChartCard(title: String, modelProducer: CartesianChartModelProducer, color: Color) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
            .height(250.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, style = MaterialTheme.typography.titleSmall)
            CartesianChartHost(
                chart = rememberCartesianChart(
                    rememberLineCartesianLayer(
                        lineProvider = LineCartesianLayer.LineProvider.series(
                            rememberLine(
                                fill = LineCartesianLayer.LineFill.single(fill(color))
                            )
                        )
                    ),
                    startAxis = rememberStartAxis(),
                    bottomAxis = rememberBottomAxis(),
                ),
                modelProducer = modelProducer,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
fun ReadingItem(reading: SensorReading, tempUnit: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                val tempStr = TemperatureUtils.format(reading.temperature, tempUnit)
                Text(text = "T: $tempStr, H: ${reading.humidity}%, P: ${reading.pressure} hPa")
            }
            Text(text = reading.createdAt.takeLast(8), style = MaterialTheme.typography.bodySmall)
        }
    }
}
