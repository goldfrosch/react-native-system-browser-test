import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View, Alert } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useCallback } from "react";

const SCHEME = "systembrowsertest";
// 시스템 브라우저가 이 URL(커스텀 스킴)로 리다이렉트하면 자동으로 닫히고
// openAuthSessionAsync가 해당 URL을 돌려줍니다.
const REDIRECT_URL = `${SCHEME}://close`;

const getWebUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:5173`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5173";
  }
  return "http://localhost:5173";
};

const WEB_URL = getWebUrl();

// "systembrowsertest://close?message=...&data=<JSON>" 형태의 딥링크에서
// message와 data(JSON)를 추출합니다. expo-linking 의존성 없이 직접 파싱합니다.
function parseRedirect(url: string): { message?: string; data?: unknown } {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return {};

  const params: Record<string, string> = {};
  for (const pair of url.slice(queryIndex + 1).split("&")) {
    if (!pair) continue;
    const eqIndex = pair.indexOf("=");
    const rawKey = eqIndex === -1 ? pair : pair.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? "" : pair.slice(eqIndex + 1);
    const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
    params[key] = decodeURIComponent(rawValue.replace(/\+/g, " "));
  }

  let data: unknown = params.data;
  if (params.data) {
    try {
      data = JSON.parse(params.data);
    } catch {
      data = params.data;
    }
  }

  return { message: params.message, data };
}

export default function App() {
  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    let payload: { type?: string; url?: string; message?: string };
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      Alert.alert("Native Message", event.nativeEvent.data);
      return;
    }

    // 메인 WebView에서 "시스템 브라우저로 열기" 요청
    if (payload.type === "OPEN_SYSTEM_BROWSER" && payload.url) {
      const separator = payload.url.includes("?") ? "&" : "?";
      const targetUrl = `${payload.url}${separator}inBrowser=true`;

      try {
        // 실제 시스템 인앱 브라우저(Custom Tabs / SFSafariViewController) 오픈.
        // 페이지가 REDIRECT_URL 스킴으로 이동하면 브라우저가 자동으로 닫히고
        // result.url 로 딥링크가 돌아옵니다.
        const result = await WebBrowser.openAuthSessionAsync(
          targetUrl,
          REDIRECT_URL
        );

        if (result.type === "success" && result.url) {
          const { message, data } = parseRedirect(result.url);
          Alert.alert(
            "시스템 브라우저에서 전달됨",
            [
              `메시지: ${message ?? "(없음)"}`,
              "",
              `데이터: ${data ? JSON.stringify(data, null, 2) : "(없음)"}`,
            ].join("\n")
          );
        }
      } catch (e) {
        Alert.alert("브라우저 오류", String(e));
      }
      return;
    }

    // 그 외 메시지는 그대로 표시
    Alert.alert("Native Message", payload.message ?? JSON.stringify(payload));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});
