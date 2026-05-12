package com.example.iothub.data.api

import com.example.iothub.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface IoTHubService {
    @GET("admin/sensors")
    suspend fun getSensors(): Response<List<Sensor>>

    @POST("sensors")
    suspend fun registerSensor(@Body request: RegisterSensorRequest): Response<Sensor>

    @GET("admin/sensors/{id}/readings")
    suspend fun getReadings(@Path("id") id: String): Response<List<SensorReading>>

    @GET("local-forecasts/{sensor_id}")
    suspend fun getForecast(
        @Path("sensor_id") sensorId: String,
        @Query("hours_ahead") hoursAhead: Int = 1
    ): Response<LocalForecast>
}
