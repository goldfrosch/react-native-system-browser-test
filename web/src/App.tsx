function App() {
  const sendToNative = () => {
    const message = JSON.stringify({
      type: "NATIVE_ACTION",
      message: "웹에서 네이티브로 메시지 전송",
    });

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(message);
    } else {
      alert("React Native WebView 환경이 아닙니다.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <button
        onClick={sendToNative}
        style={{
          padding: "16px 32px",
          fontSize: "18px",
          cursor: "pointer",
          border: "none",
          borderRadius: "8px",
          backgroundColor: "#007AFF",
          color: "#fff",
        }}
      >
        클릭
      </button>
    </div>
  );
}

export default App;
