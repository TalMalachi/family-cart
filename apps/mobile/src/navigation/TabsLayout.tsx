import { Tabs }       from 'expo-router'
import { Colors, FontSize } from '../../utils/theme'
import { useAuth }    from '../../store/auth'

export default function TabsLayout() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.teal,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          paddingBottom: 6,
          height: 58,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color }) => <TabBarEmoji emoji="☑" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TabBarEmoji emoji="₪" color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Family',
          tabBarIcon: ({ color }) => <TabBarEmoji emoji="👥" color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarEmoji emoji="👤" color={color} />,
        }}
      />
    </Tabs>
  )
}

import { Text } from 'react-native'
function TabBarEmoji({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>
}