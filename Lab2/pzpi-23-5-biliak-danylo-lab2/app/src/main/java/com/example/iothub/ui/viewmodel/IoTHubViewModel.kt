package com.example.iothub.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.iothub.data.local.FavoriteSensorsManager
import com.example.iothub.data.local.ServerSettingsManager
import com.example.iothub.data.model.*
import com.example.iothub.data.repository.IoTHubRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class IoTHubViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = IoTHubRepository()
    private val favoriteManager = FavoriteSensorsManager(application)
    private val settingsManager = ServerSettingsManager(application)

    val serverUrl: StateFlow<String?> = settingsManager.serverUrl
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val defaultHoursAhead: StateFlow<Int> = settingsManager.defaultHoursAhead
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 1)

    val language: StateFlow<String> = settingsManager.language
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "en")

    val tempUnit: StateFlow<String> = settingsManager.tempUnit
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "C")

    private val _allSensors = MutableStateFlow<List<Sensor>>(emptyList())
    val favoriteSensorIds: StateFlow<Set<String>> = favoriteManager.favoriteSensorIds
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    val sensors: StateFlow<List<Sensor>> = combine(_allSensors, favoriteSensorIds) { all, favorites ->
        all.filter { it.id in favorites }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allSensors: StateFlow<List<Sensor>> = _allSensors

    private val _readings = MutableStateFlow<List<SensorReading>>(emptyList())
    val readings: StateFlow<List<SensorReading>> = _readings

    private val _forecast = MutableStateFlow<LocalForecast?>(null)
    val forecast: StateFlow<LocalForecast?> = _forecast

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    init {
        viewModelScope.launch {
            serverUrl.collect { url ->
                if (url != null) refreshSensors()
            }
        }
    }

    fun saveServerUrl(url: String) {
        viewModelScope.launch {
            settingsManager.saveServerUrl(url)
        }
    }

    fun saveDefaultHoursAhead(hours: Int) {
        viewModelScope.launch {
            settingsManager.saveDefaultHoursAhead(hours)
        }
    }

    fun saveLanguage(lang: String) {
        viewModelScope.launch {
            settingsManager.saveLanguage(lang)
        }
    }

    fun saveTempUnit(unit: String) {
        viewModelScope.launch {
            settingsManager.saveTempUnit(unit)
        }
    }

    fun clearServerUrl() {
        viewModelScope.launch {
            settingsManager.saveServerUrl("") // Пустая строка сбросит на SetupScreen
        }
    }

    fun refreshSensors() {
        val url = serverUrl.value ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = repository.getSensors(url)
                if (response.isSuccessful) {
                    _allSensors.value = response.body() ?: emptyList()
                    _errorMessage.value = null
                } else {
                    _errorMessage.value = "Failed to fetch sensors: ${response.message()}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun toggleFavorite(sensorId: String) {
        viewModelScope.launch {
            if (favoriteSensorIds.value.contains(sensorId)) {
                favoriteManager.removeFavorite(sensorId)
            } else {
                favoriteManager.addFavorite(sensorId)
            }
        }
    }

    fun fetchReadings(id: String) {
        val url = serverUrl.value ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = repository.getReadings(url, id)
                if (response.isSuccessful) {
                    _readings.value = response.body() ?: emptyList()
                    _errorMessage.value = null
                } else {
                    _errorMessage.value = "Failed to fetch readings: ${response.message()}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun fetchForecast(id: String, hoursAhead: Int = 1) {
        val url = serverUrl.value ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = repository.getForecast(url, id, hoursAhead)
                if (response.isSuccessful) {
                    _forecast.value = response.body()
                    _errorMessage.value = null
                } else {
                    _forecast.value = null
                    _errorMessage.value = "Failed to fetch forecast: ${response.message()}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Error: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
