import {Component} from "react";


export default class ErrorBoundary extends Component {
    state = {error: null};

    static getDerivedStateFromError(error) {
        return {error};
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary]", error, info?.componentStack);
    }

    componentDidUpdate(prevProps) {
        if (!this.state.error) return;
        const prev = prevProps.resetKeys ?? [];
        const next = this.props.resetKeys ?? [];
        if (prev.length !== next.length || prev.some((v, i) => !Object.is(v, next[i]))) {
            this.reset();
        }
    }

    reset = () => this.setState({error: null});

    render() {
        const {error} = this.state;
        if (!error) return this.props.children;
        return this.props.fallback
            ? this.props.fallback(error, this.reset)
            : <FallbackScreen error={error} onRetry={this.reset}/>;
    }
}

function FallbackScreen({error, onRetry}) {
    return (
        <div role="alert" style={{
            minHeight: "60vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center",
        }}>
            <h2 style={{margin: 0}}>Đã có lỗi xảy ra</h2>
            <p style={{margin: 0, color: "#6b7280", maxWidth: 420}}>
                Trang này gặp sự cố khi hiển thị. Bạn có thể thử lại hoặc tải lại trang.
            </p>
            {import.meta.env.DEV && (
                <pre style={{maxWidth: "90vw", overflow: "auto", fontSize: 12, color: "#b91c1c"}}>
                    {String(error?.message ?? error)}
                </pre>
            )}
            <div style={{display: "flex", gap: 8}}>
                <button type="button" onClick={onRetry}>Thử lại</button>
                <button type="button" onClick={() => window.location.reload()}>Tải lại trang</button>
            </div>
        </div>
    );
}
