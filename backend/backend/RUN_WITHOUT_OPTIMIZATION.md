# Running Without Optimization Profile

Due to the initialization issues, please first try running the application WITHOUT the optimization profile:

## Step 1: Run with default profile only

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

Or if using java -jar:

```bash
java -jar backend.jar --spring.profiles.active=local
```

## Step 2: If that works, gradually enable optimization

If the application starts successfully without the optimization profile, you can gradually enable optimization features:

### Option A: Enable only specific optimizations

Instead of using the full optimization profile, you can selectively enable features in your `application-local.yml`:

```yaml
# Add these one by one to test
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
```

### Option B: Debug the optimization profile

If you need to debug why the optimization profile isn't working:

1. Run with debug logging:
```bash
./gradlew bootRun --args='--spring.profiles.active=local,optimization --debug'
```

2. Check for circular dependencies:
- The CacheWarmupService might be trying to access services before they're ready
- The aspect configurations might be interfering with bean initialization

### Option C: Disable problematic components

You can disable specific optimization components by setting properties:

```yaml
# In application-local.yml
cache:
  warmup:
    enabled: false
    
transaction:
  validation:
    enabled: false
    
management:
  endpoints:
    web:
      exposure:
        include: health,info  # Remove 'cache' and 'metrics' temporarily
```

## The Root Cause

The error "ListableBeanFactory must not be null" typically occurs when:
1. A component tries to access the ApplicationContext too early
2. There's a circular dependency between beans
3. An aspect or event listener interferes with the initialization order

The optimization profile introduces several complex configurations that might be causing these issues.