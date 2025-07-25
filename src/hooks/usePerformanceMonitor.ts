import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  } | null;
  renderTime: number;
  componentRenderCount: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  interval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    interval = 1000,
    onMetricsUpdate
  } = options;

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Track FPS
  const measureFPS = useCallback(() => {
    frameCountRef.current++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;

    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
      return fps;
    }
    return null;
  }, []);

  // Get memory usage
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  // Measure render time
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      return endTime - startTime;
    };
  }, []);

  // Increment render count
  const incrementRenderCount = useCallback(() => {
    renderCountRef.current++;
  }, []);

  // Start monitoring
  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      const fps = measureFPS();
      const memoryUsage = getMemoryUsage();
      
      if (fps !== null) {
        const metrics: PerformanceMetrics = {
          fps,
          memoryUsage,
          renderTime: 0, // Will be set by measureRenderTime
          componentRenderCount: renderCountRef.current
        };

        onMetricsUpdate?.(metrics);
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Performance Metrics:', {
            FPS: fps,
            Memory: memoryUsage ? {
              Used: `${(memoryUsage.used / 1024 / 1024).toFixed(2)} MB`,
              Total: `${(memoryUsage.total / 1024 / 1024).toFixed(2)} MB`,
              Limit: `${(memoryUsage.limit / 1024 / 1024).toFixed(2)} MB`
            } : 'Not available',
            RenderCount: renderCountRef.current
          });
        }
      }
    };

    intervalRef.current = setInterval(updateMetrics, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, onMetricsUpdate, measureFPS, getMemoryUsage]);

  return {
    measureRenderTime,
    incrementRenderCount,
    getCurrentMetrics: () => ({
      fps: frameCountRef.current,
      memoryUsage: getMemoryUsage(),
      renderTime: 0,
      componentRenderCount: renderCountRef.current
    })
  };
};

// Hook for monitoring specific component performance
export const useComponentPerformance = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      lastRenderTimeRef.current = endTime - startTime;
    };
  });

  const getComponentMetrics = useCallback(() => ({
    name: componentName,
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current
  }), [componentName]);

  return {
    getComponentMetrics,
    incrementRenderCount: () => renderCountRef.current++
  };
};

// Hook for monitoring game loop performance
export const useGameLoopPerformance = (loopName: string) => {
  const frameTimeRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());

  const startFrame = useCallback(() => {
    lastFrameTimeRef.current = performance.now();
  }, []);

  const endFrame = useCallback(() => {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTimeRef.current;
    
    frameTimeRef.current.push(frameTime);
    
    // Keep only last 60 frames for average calculation
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }
  }, []);

  const getLoopMetrics = useCallback(() => {
    const frames = frameTimeRef.current;
    if (frames.length === 0) return null;

    const avgFrameTime = frames.reduce((sum, time) => sum + time, 0) / frames.length;
    const maxFrameTime = Math.max(...frames);
    const minFrameTime = Math.min(...frames);
    const fps = 1000 / avgFrameTime;

    return {
      name: loopName,
      avgFrameTime: avgFrameTime.toFixed(2),
      maxFrameTime: maxFrameTime.toFixed(2),
      minFrameTime: minFrameTime.toFixed(2),
      fps: fps.toFixed(1),
      frameCount: frames.length
    };
  }, [loopName]);

  return {
    startFrame,
    endFrame,
    getLoopMetrics
  };
};

// Hook for monitoring save operations performance
export const useSavePerformance = () => {
  const saveTimesRef = useRef<number[]>([]);
  const lastSaveTimeRef = useRef(0);

  const startSave = useCallback(() => {
    lastSaveTimeRef.current = performance.now();
  }, []);

  const endSave = useCallback(() => {
    const currentTime = performance.now();
    const saveTime = currentTime - lastSaveTimeRef.current;
    
    saveTimesRef.current.push(saveTime);
    
    // Keep only last 10 save times
    if (saveTimesRef.current.length > 10) {
      saveTimesRef.current.shift();
    }
  }, []);

  const getSaveMetrics = useCallback(() => {
    const times = saveTimesRef.current;
    if (times.length === 0) return null;

    const avgSaveTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxSaveTime = Math.max(...times);
    const minSaveTime = Math.min(...times);

    return {
      avgSaveTime: avgSaveTime.toFixed(2),
      maxSaveTime: maxSaveTime.toFixed(2),
      minSaveTime: minSaveTime.toFixed(2),
      saveCount: times.length
    };
  }, []);

  return {
    startSave,
    endSave,
    getSaveMetrics
  };
}; 