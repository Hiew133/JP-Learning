// Màn hình loading / lỗi dùng chung cho các trang load dữ liệu từ backend
export default function PageState({ onBack, error = '', onRetry }) {
  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← 戻る</button>
      <div className="card state-card">
        {error ? (
          <>
            <p className="lib-error">⚠️ {error}</p>
            <p className="lib-note">
              Backend chưa chạy? Mở terminal và chạy: <code>cd backend</code> rồi <code>npm run dev</code>
            </p>
            <button className="btn-primary" onClick={onRetry}>🔄 Thử lại</button>
          </>
        ) : (
          <div className="loading-row">
            <span className="spinner" />
            <p className="lib-loading">読み込み中...</p>
          </div>
        )}
      </div>
    </div>
  )
}
