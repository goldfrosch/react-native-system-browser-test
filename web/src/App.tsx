import { useEffect, useCallback } from "react";

const SCHEME = "systembrowsertest";

function App() {
  // 네이티브가 시스템 브라우저로 열 때 ?inBrowser=true 를 붙여줍니다.
  // 시스템 브라우저(Custom Tabs / SFSafariViewController)에는 RN 브릿지가 없으므로
  // 이 플래그로 "닫기 + 데이터 전송" 모드인지 판별합니다.
  const isInBrowser = new URLSearchParams(window.location.search).has(
    "inBrowser"
  );

  // 시스템 브라우저: 브릿지가 없으므로 딥링크 리다이렉트로 네이티브에 전달.
  // 네이티브의 openAuthSessionAsync가 이 scheme 리다이렉트를 감지해
  // 브라우저를 자동으로 닫고 URL을 돌려받습니다.
  const handleClose = useCallback(() => {
    const message = "시스템 브라우저에서 보낸 메시지입니다";
    const data = {
      timestamp: Date.now(),
      from: "system-browser",
      items: ["apple", "banana", "cherry"],
    };

    const params = new URLSearchParams({
      message,
      data: JSON.stringify(data),
    });

    window.location.href = `${SCHEME}://close?${params.toString()}`;
  }, []);

  // 메인 WebView: RN 브릿지로 시스템 브라우저 오픈 요청
  const handleOpen = useCallback(() => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "OPEN_SYSTEM_BROWSER",
          url: window.location.href,
        })
      );
    } else {
      alert("이 화면은 네이티브 앱의 WebView 안에서 실행되어야 합니다.");
    }
  }, []);

  // window.open / window.close 오버라이드
  // WebView 내에서 window.open → 시스템 브라우저 열기
  // 시스템 브라우저 내에서 window.close → 딥링크 리다이렉트로 닫기
  useEffect(() => {
    if (isInBrowser) {
      // 시스템 브라우저 모드: window.close를 handleClose로 연결
      const originalClose = window.close;
      window.close = () => {
        handleClose();
      };
      return () => {
        window.close = originalClose;
      };
    } else {
      // WebView 모드: window.open을 시스템 브라우저 열기로 연결
      const originalOpen = window.open;
      window.open = (url?: string | URL | null) => {
        const targetUrl = url instanceof URL ? url.href : url ?? window.location.href;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: "OPEN_SYSTEM_BROWSER",
              url: targetUrl,
            })
          );
        }
        return null;
      };
      return () => {
        window.open = originalOpen;
      };
    }
  }, [isInBrowser, handleClose]);

  // 시스템 브라우저 모드: 마운트 시 즉시 닫기 + 데이터 전송
  useEffect(() => {
    if (isInBrowser) {
      handleClose();
    }
  }, [isInBrowser, handleClose]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ color: "#666", margin: 0 }}>
        {isInBrowser ? "시스템 브라우저 모드" : "메인 WebView 모드"}
      </p>
      <button
        onClick={isInBrowser ? handleClose : handleOpen}
        style={{
          padding: "16px 32px",
          fontSize: "18px",
          cursor: "pointer",
          border: "none",
          borderRadius: "8px",
          backgroundColor: isInBrowser ? "#FF3B30" : "#007AFF",
          color: "#fff",
        }}
      >
        {isInBrowser ? "닫기 + 데이터 전송" : "시스템 브라우저로 열기"}
      </button>
    </div>
  );
}

export default App;
