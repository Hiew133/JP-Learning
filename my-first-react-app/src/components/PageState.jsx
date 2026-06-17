// Màn hình loading / lỗi dùng chung cho các trang load dữ liệu từ backend
export default function PageState({ onBack, error = '', onRetry }) {
  return (
    <div className="page">
      <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
      <div className="card state-card" role="status" aria-live="polite">
        {error ? (
          <>
            <p className="lib-error"><span aria-hidden="true">⚠️ </span>{error}</p>
            <p className="lib-note">
              Backend chưa chạy? Mở terminal và chạy: <code>cd backend</code> rồi <code>npm run dev</code>
            </p>
            <button className="btn-primary" onClick={onRetry}>🔄 Thử lại</button>
          </>
        ) : (
          <div className="loading-row">
            <span className="spinner" aria-hidden="true" />
            <p className="lib-loading"><span lang="ja">読み込み中...</span><span className="sr-only"> Đang tải</span></p>
          </div>
        )}
      </div>
    </div>
  )
}
