package com.example.iothub.data.model

import com.google.gson.annotations.SerializedName

data class SensorReading(
    val id: Int,
    @SerializedName("sensor_id") val sensorId: String,
    val temperature: Float,
    val humidity: Float,
    val pressure: Float,
    @SerializedName("created_at") val createdAt: String
)
