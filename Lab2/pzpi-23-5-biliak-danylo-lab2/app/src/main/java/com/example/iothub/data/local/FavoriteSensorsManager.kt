package com.example.iothub.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "favorites")

class FavoriteSensorsManager(private val context: Context) {
    private val FAVORITE_SENSORS_KEY = stringSetPreferencesKey("favorite_sensors")

    val favoriteSensorIds: Flow<Set<String>> = context.dataStore.data
        .map { preferences ->
            preferences[FAVORITE_SENSORS_KEY] ?: emptySet()
        }

    suspend fun addFavorite(sensorId: String) {
        context.dataStore.edit { preferences ->
            val current = preferences[FAVORITE_SENSORS_KEY] ?: emptySet()
            preferences[FAVORITE_SENSORS_KEY] = current + sensorId
        }
    }

    suspend fun removeFavorite(sensorId: String) {
        context.dataStore.edit { preferences ->
            val current = preferences[FAVORITE_SENSORS_KEY] ?: emptySet()
            preferences[FAVORITE_SENSORS_KEY] = current - sensorId
        }
    }
}
