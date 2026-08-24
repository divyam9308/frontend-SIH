export type ProjectEvidence={id:string;name:string;sector:string;actualCost:number;predictedCost:number;actualDelay:number;predictedDelay:number;actualRisk:string;predictedRisk:string;confidence:number};
export type EvaluationRun={id:string;name:string;training:string;holdout:string;costOffset:number;delayOffset:number};
export const evaluationRuns:EvaluationRun[]=[{id:'default',name:'Default Lifecycle Run',training:'2001–2015',holdout:'2016–2020',costOffset:0,delayOffset:0},{id:'recalibrated',name:'Recalibrated Lifecycle Run',training:'2001–2016',holdout:'2017–2020',costOffset:-2,delayOffset:-8}];
const base:ProjectEvidence[]=[
 {id:'PM-001',name:'NH-44 Highway Upgrade',sector:'Roads',actualCost:42,predictedCost:37,actualDelay:420,predictedDelay:390,actualRisk:'High',predictedRisk:'High',confidence:0.86},
 {id:'PM-014',name:'Eastern Freight Corridor',sector:'Rail',actualCost:68,predictedCost:73,actualDelay:680,predictedDelay:715,actualRisk:'Critical',predictedRisk:'Critical',confidence:0.91},
 {id:'PM-027',name:'Kaveri Water Grid',sector:'Water',actualCost:18,predictedCost:22,actualDelay:145,predictedDelay:169,actualRisk:'Moderate',predictedRisk:'Moderate',confidence:0.79},
 {id:'PM-038',name:'Coastal Solar Park',sector:'Energy',actualCost:8,predictedCost:4,actualDelay:48,predictedDelay:32,actualRisk:'Low',predictedRisk:'Low',confidence:0.83},
 {id:'PM-052',name:'Metro Phase III',sector:'Urban',actualCost:53,predictedCost:46,actualDelay:510,predictedDelay:448,actualRisk:'High',predictedRisk:'Moderate',confidence:0.68},
 {id:'PM-061',name:'Regional Airport Extension',sector:'Aviation',actualCost:31,predictedCost:35,actualDelay:272,predictedDelay:298,actualRisk:'Moderate',predictedRisk:'High',confidence:0.72},
 {id:'PM-075',name:'North Port Modernisation',sector:'Ports',actualCost:76,predictedCost:70,actualDelay:810,predictedDelay:755,actualRisk:'Critical',predictedRisk:'Critical',confidence:0.89},
 {id:'PM-083',name:'State Medical College',sector:'Social',actualCost:12,predictedCost:15,actualDelay:96,predictedDelay:112,actualRisk:'Low',predictedRisk:'Low',confidence:0.81},
 ];
export const getPredictionAccuracyData=(run:EvaluationRun)=>({run,projects:base.map(p=>({...p,predictedCost:p.predictedCost+run.costOffset,predictedDelay:p.predictedDelay+run.delayOffset})),prototype:true});
