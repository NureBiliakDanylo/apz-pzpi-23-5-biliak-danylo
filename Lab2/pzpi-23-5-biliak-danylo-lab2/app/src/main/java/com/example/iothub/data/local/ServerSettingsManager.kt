package com.example.iothub.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ServerSettingsManager(private val context: Context) {
    private val SERVER_URL_KEY = stringPreferencesKey("server_url")
    private val DEFAULT_HOURS_AHEAD_KEY = intPreferencesKey("default_hours_ahead")
    private val LANGUAGE_KEY = stringPreferencesKey("language")
    private val TEMP_UNIT_KEY = stringPreferencesKey("temp_unit")

    val serverUrl: Flow<String?> = context.dataStore.data
        .map { preferences ->
            val url = preferences[SERVER_URL_KEY]
            if (url.isNullOrBlank()) null else url
        }

    val defaultHoursAhead: Flow<Int> = context.dataStore.data
        .map { preferences ->
            preferences[DEFAULT_HOURS_AHEAD_KEY] ?: 1
        }

    val language: Flow<String> = context.dataStore.data
        .map { preferences ->
            preferences[LANGUAGE_KEY] ?: "en"
        }

    val tempUnit: Flow<String> = context.dataStore.data
        .map { preferences ->
            preferences[TEMP_UNIT_KEY] ?: "C"
        }

    suspend fun saveServerUrl(url: String) {
        // Убедимся, что URL имеет правильный формат (http://...)
        val formattedUrl = if (!url.startsWith("http")) "http://$url" else url
        val finalUrl = if (!formattedUrl.endsWith("/")) "$formattedUrl/" else formattedUrl
        
        context.dataStore.edit { preferences ->
            preferences[SERVER_URL_KEY] = finalUrl
        }
    }

    suspend fun saveDefaultHoursAhead(hours: Int) {
        context.dataStore.edit { preferences ->
            preferences[DEFAULT_HOURS_AHEAD_KEY] = hours
        }
    }

    suspend fun saveLanguage(lang: String) {
        context.dataStore.edit { preferences ->
            preferences[LANGUAGE_KEY] = lang
        }
    }

    suspend fun saveTempUnit(unit: String) {
        context.dataStore.edit { preferences ->
            preferences[TEMP_UNIT_KEY] = unit
        }
    }
}
