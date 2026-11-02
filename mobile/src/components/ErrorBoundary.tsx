import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { AlertTriangle } from 'lucide-react-native';
import { AppPressable } from './AppPressable';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error in app tree:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 bg-slate-50 items-center justify-center p-4">
          <View className="w-full max-w-xs bg-white rounded-[32px] shadow-2xl border border-slate-100 p-8 items-center">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
              <AlertTriangle size={32} color="#dc2626" />
            </View>
            <Text className="text-lg font-bold text-slate-800 mb-2 text-center">Something went wrong</Text>
            <Text className="text-sm text-slate-500 mb-8 text-center">
              The app hit an unexpected error. Reloading usually fixes it.
            </Text>
            <AppPressable
              onPress={() => this.setState({ error: null })}
              className="w-full py-4 rounded-2xl bg-green-600 items-center shadow-lg shadow-green-200"
            >
              <Text className="text-white text-sm font-bold">Reload</Text>
            </AppPressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
