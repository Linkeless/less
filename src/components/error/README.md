# 错误处理最佳实践

本目录包含了项目中错误处理的最佳实践实现，包括错误边界、错误显示组件和错误处理hooks。

## 组件概览

### 1. ErrorBoundary (错误边界)
`ErrorBoundary.tsx` - React错误边界组件，用于捕获和处理React组件树中的JavaScript错误。

**特性:**
- 自动错误捕获和恢复
- 可配置的重试机制 (最大重试次数)
- 支持props变化时自动重置
- 详细的错误日志记录
- 开发环境下显示技术详情

**使用示例:**
```tsx
<ErrorBoundary 
  resetKeys={[data, user]} 
  maxRetries={3}
  onError={(error, errorInfo) => console.error('Error:', error)}
>
  <YourComponent />
</ErrorBoundary>
```

### 2. ErrorDisplay (错误显示)
`ErrorDisplay.tsx` - 统一的错误显示UI组件，用于展示各种类型的错误信息。

**错误类型:**
- `network` - 网络连接错误
- `server` - 服务器错误 (5xx)
- `auth` - 身份验证失败 (401)
- `permission` - 权限不足 (403)
- `validation` - 数据验证错误 (4xx)
- `unknown` - 未知错误

**使用示例:**
```tsx
<ErrorDisplay
  error={{
    type: 'network',
    message: '网络连接失败',
    code: 0
  }}
  onRetry={() => refetch()}
  showRetryButton={true}
  showDismissButton={true}
/>
```

## Hooks

### useErrorHandler
通用错误处理hook，提供完整的错误状态管理和重试机制。

**特性:**
- 自动重试（支持指数退避）
- 错误状态管理
- 重试次数限制
- 错误类型识别

### useApiErrorHandler  
专门用于API请求的错误处理hook，继承自`useErrorHandler`。

**使用示例:**
```tsx
const { 
  error, 
  isRetrying, 
  retry, 
  withApiErrorHandling 
} = useApiErrorHandler();

const fetchData = async () => {
  const result = await withApiErrorHandling(
    () => apiCall(),
    '获取数据失败'
  );
};
```

## 实施的最佳实践

### 1. 多层错误处理
- **应用级别**: 顶层ErrorBoundary捕获未处理的错误
- **页面级别**: 页面ErrorBoundary处理页面特定错误  
- **组件级别**: 组件ErrorBoundary隔离组件错误
- **API级别**: useApiErrorHandler处理接口错误

### 2. 用户友好的错误信息
- 根据错误类型显示不同的图标和颜色
- 提供清晰的错误描述和建议操作
- 支持重试和忽略功能
- 在开发环境提供技术详情

### 3. 智能重试机制
- 网络错误: 自动重试，指数退避
- 服务器错误: 限制重试次数
- 认证错误: 不自动重试，引导重新登录
- 权限错误: 不自动重试

### 4. 错误日志和监控
- 详细的错误日志记录
- 支持集成外部监控服务 (Sentry, LogRocket等)
- 包含错误ID、时间戳、用户代理等上下文信息

### 5. 渐进式降级
- 部分组件错误不影响整个页面
- 提供fallback UI保证页面基本功能
- 用户可以继续使用其他正常功能

## 在Dashboard中的应用

Dashboard页面实现了完整的错误处理策略:

1. **全局错误显示**: 页面顶部显示API错误，支持重试和忽略
2. **组件隔离**: 每个主要组件都有独立的ErrorBoundary
3. **数据获取错误处理**: useUserData集成了错误处理机制
4. **用户操作错误处理**: 重置UUID等操作的错误处理

这确保了即使在网络不稳定或服务器异常的情况下，用户仍能获得良好的体验。