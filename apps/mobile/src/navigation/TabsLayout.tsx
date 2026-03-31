import { Tabs }       from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontSize, Radius, Shadow, Space } from '../../utils/theme'
import { useAuth }    from '../../store/auth'

export default function TabsLayout() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.isSuperAdmin

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.teal,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 20,
          right: 20,
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.xl,
          height: 64,
          borderTopWidth: 0,
          paddingBottom: 0,
          ...Shadow.elevated,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, focused }) => <TabBarIcon emoji="☑" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, focused }) => <TabBarIcon emoji="₪" color={color} focused={focused} />,
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, focused }) => <TabBarIcon emoji="👥" color={color} focused={focused} />,
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon emoji="👤" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  )
}

function TabBarIcon({ emoji, color, focused }: { emoji: string; color: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={{ fontSize: 18, color }}>{emoji}</Text>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.tealLight,
  },
})