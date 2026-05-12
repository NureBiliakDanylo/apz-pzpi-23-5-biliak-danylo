package com.example.iothub.data.model

import com.google.gson.annotations.SerializedName

data class LocalForecast(
    val id: Int,
    @SerializedName("sensor_id") val sensorId: String,
    @SerializedName("forecast_time") val forecastTime: String,
    @SerializedName("hours_ahead") val hoursAhead: Int,
    @SerializedName("predicted_temp") val predictedTemp: Float,
    @SerializedName("predicted_humidity") val predictedHumidity: Float,
    @SerializedName("predicted_pressure") val predictedPressure: Float,
    val note: String?
)
