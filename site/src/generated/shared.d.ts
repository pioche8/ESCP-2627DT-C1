// Hand-written types for the three CommonJS files copied from the app (engine.cjs, data.cjs, insights.cjs). Not generated.
declare module '@/generated/engine.cjs' {
  const Engine: import('../data/types').EngineApi;
  export default Engine;
}
declare module '@/generated/data.cjs' {
  const DEMO: import('../data/types').Demo;
  export default DEMO;
}
declare module '@/generated/insights.cjs' {
  const Insights: import('../data/types').InsightsApi;
  export default Insights;
}
