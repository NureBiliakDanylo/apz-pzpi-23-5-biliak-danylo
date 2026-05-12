package com.example.iothub.data.repository

import com.example.iothub.data.api.IoTHubService
import com.example.iothub.data.model.*
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class IoTHubRepository {
    private var currentService: IoTHubService? = null
    private var currentUrl: String? = null

    private fun getService(baseUrl: String): IoTHubService {
        if (currentUrl != baseUrl || currentService == null) {
            currentUrl = baseUrl
            currentService = Retrofit.Builder()
                .baseUrl(baseUrl)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(IoTHubService::class.java)
        }
        return currentService!!
    }

    suspend fun getSensors(baseUrl: String) = getService(baseUrl).getSensors()
    suspend fun getReadings(baseUrl: String, id: String) = getService(baseUrl).getReadings(id)
    suspend fun getForecast(baseUrl: String, id: String, hoursAhead: Int) = getService(baseUrl).getForecast(id, hoursAhead)
}
