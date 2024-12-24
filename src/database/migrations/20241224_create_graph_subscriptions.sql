CREATE TABLE IF NOT EXISTS graph_subscriptions (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(255) NOT NULL,
    change_type VARCHAR(255) NOT NULL,
    notification_url TEXT NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    client_state VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_subscriptions_status ON graph_subscriptions(status);
CREATE INDEX idx_graph_subscriptions_expiration ON graph_subscriptions(expiration_date) WHERE status = 'active';
