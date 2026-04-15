import json
import xml.etree.ElementTree as ET

# Цільовий інтерфейс (Target)
class AnalyticsLibraryInterface:
    def analyze_data(self, xml_data: str) -> str:
        """Метод, який очікує клієнтський код (працює з XML)"""
        pass

# Стороння бібліотека (Adaptee) - Несумісний інтерфейс
class AdvancedJSONAnalytics:
    def display_charts(self, json_data: dict) -> str:
        """Стороння логіка, яка приймає лише словник/JSON"""
        # Логіка побудови графіка на основі JSON
        return f"Графік успішно побудовано за даними: {json_data}"

# Клас Адаптер (Adapter)
class XMLToJSONAdapter(AnalyticsLibraryInterface):
    def __init__(self, analytics_service: AdvancedJSONAnalytics):
        self._analytics_service = analytics_service

    # Реалізуємо метод, який очікує клієнт (XML)
    def analyze_data(self, xml_data: str) -> str:
        # Етап 1: Конвертація з XML у зрозумілий формат (Словник/JSON)
        root = ET.fromstring(xml_data)
        json_ready_data = {child.tag: child.text for child in root}
        
        # Етап 2: Виклик методу сторонньої бібліотеки через адаптований інтерфейс
        return self._analytics_service.display_charts(json_ready_data)

if __name__ == "__main__":
    my_xml_data = "<data><sales>1500</sales><profit>300</profit></data>"

    json_service = AdvancedJSONAnalytics()

    adapter = XMLToJSONAdapter(json_service)

    print("Клієнт відправляє XML дані до адаптера...")
    result = adapter.analyze_data(my_xml_data)
    
    print("\nРезультат роботи:")
    print(result)
