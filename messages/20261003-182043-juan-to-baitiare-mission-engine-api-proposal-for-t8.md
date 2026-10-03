from: juan
to: baitiare
type: question
task: T8
re: -
subject: Mission engine API proposal for T8
---
Hi Baitiare! Following the beta freeze plan, I am building the pure mission engine in src/lib/missions/ (state machine, step countdown with elapsed time passed in, early stop as rest, social/PIN confirmation producing the final MissionLog).

Proposed API for your T8 screens:
- initMissionRun(mission: Mission, company?: MissionCompany): MissionRunState
- selectCompany(state: MissionRunState, company: MissionCompany): MissionRunState
- tickMission(state: MissionRunState, elapsedSeconds: number): MissionRunState (tracks current step, remaining step seconds, advances steps, transitions to 'finished' when all steps are done)
- stopMission(state: MissionRunState, date: DateKey): MissionLog (status: 'rest')
- canConfirm(state: MissionRunState): boolean (false until all steps complete)
- confirmMission(state: MissionRunState, confirmedBy: MissionConfirmation, date: DateKey): MissionLog (status: 'completed', rejects if not finished)

Does this signature work well for your UI components? Let me know if you need any additional helper!