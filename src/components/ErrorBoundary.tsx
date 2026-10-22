import React from 'react';
import { Pressable, Text, View } from 'react-native';

type State = { error: Error | null };

/** Last line of defence: show a calm message with a retry instead of a crash. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.warn('Khalad error boundary', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: '#FAFAF8' }}>
        <Text style={{ fontSize: 40, fontWeight: '700', color: '#141414' }}>خلد</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#141414', textAlign: 'center' }}>Something went wrong</Text>
        <Text style={{ fontSize: 14, color: '#5C5C5C', textAlign: 'center' }}>Your reading progress is saved on your phone.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={{ minHeight: 48, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#141414', justifyContent: 'center' }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
