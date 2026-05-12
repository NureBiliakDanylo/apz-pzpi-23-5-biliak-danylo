package com.example.iothub.data.model

import com.google.gson.annotations.SerializedName

data class Sensor(
    val id: String,
    val name: String,
    val location: String,
    @SerializedName("api_key") val apiKey: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("last_seen_at") val lastSeenAt: String?
)

data class RegisterSensorRequest(
    val name: String,
    val location: String
)
