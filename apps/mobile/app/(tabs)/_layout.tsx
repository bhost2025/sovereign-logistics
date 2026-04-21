import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 16, color }}>{symbol}</Text>
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e8ebee',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#0A1A3C',
        tabBarInactiveTintColor: '#8a9aaa',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="tablero"
        options={{
          tabBarLabel: 'Tablero',
          tabBarIcon: ({ color }) => <TabIcon symbol="◈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Contenedores',
          tabBarIcon: ({ color }) => <TabIcon symbol="◱" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          tabBarLabel: 'Alertas',
          tabBarIcon: ({ color }) => <TabIcon symbol="◆" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <TabIcon symbol="◎" color={color} />,
        }}
      />
    </Tabs>
  )
}
