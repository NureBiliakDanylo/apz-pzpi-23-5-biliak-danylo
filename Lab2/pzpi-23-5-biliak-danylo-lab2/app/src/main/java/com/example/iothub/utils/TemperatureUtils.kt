package com.example.iothub.utils

import java.util.Locale

object TemperatureUtils {
    fun convert(celsius: Float, unit: String): Float {
        return when (unit) {
            "F" -> celsius * 9 / 5 + 32
            "K" -> celsius + 273.15f
            else -> celsius
        }
    }

    fun format(value: Float, unit: String): String {
        val converted = convert(value, unit)
        val unitStr = when (unit) {
            "F" -> "°F"
            "K" -> "K"
            else -> "°C"
        }
        return String.format(Locale.US, "%.1f %s", converted, unitStr)
    }
}
