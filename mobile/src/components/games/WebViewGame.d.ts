import type { ViewStyle } from 'react-native';
import type { GameComponentProps } from './types';

export function WebViewGame(props: GameComponentProps & { html: string; style: ViewStyle }): React.JSX.Element;
