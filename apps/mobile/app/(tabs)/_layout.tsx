import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0A1A3C' },
        headerTintColor: '#F1F5F9',
        headerTitleStyle: { fontWeight: '800', fontSize: 15 },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e8ebee' },
        tabBarActiveTintColor: '#0A1A3C',
        tabBarInactiveTintColor: '#8a9aaa',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Contenedores', tabBarLabel: 'Tablero' }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Mi Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tabs>
  )
}
