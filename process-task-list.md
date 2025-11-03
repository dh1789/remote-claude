# Task List Management

Guidelines for managing task lists in markdown files to track progress on completing a PRD

## Task Implementation
- **One sub-task at a time:** Do **NOT** start the next sub‑task until you ask the user for permission and they say "yes" or "y". **Use the AskUserQuestion tool** to present options and gather user decisions efficiently through Claude Code's interactive interface.
- **Test Execution Policy:**
  - **NEVER skip tests**: All tests must be executed completely, even if they take time
  - **Timeout setting**: Set test timeout to 10 minutes (600000ms) to allow sufficient execution time
  - **Wait for completion**: Always wait for full test suite to complete before proceeding
  - **No shortcuts**: Do not use grep, tail, or other methods to skip test execution
- **Completion protocol:**
  1. When you finish a **sub‑task**, immediately mark it as completed by changing `[ ]` to `[x]`.
  2. If **all** subtasks underneath a parent task are now `[x]`, follow this sequence:
    - **First**: Run the full test suite (`pytest`, `npm test`, `bin/rails test`, etc.) with 10-minute timeout
    - **Only if all tests pass**: Stage changes (`git add .`)
    - **Clean up**: Remove any temporary files and temporary code before committing
    - **Commit**: Use a descriptive commit message that:
      - Uses conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
      - Summarizes what was accomplished in the parent task
      - Lists key changes and additions
      - References the task number and PRD context
      - **Formats the message as a single-line command using `-m` flags**, e.g.:

        ```
        git commit -m "feat: add payment validation logic" -m "- Validates card type and expiry" -m "- Adds unit tests for edge cases" -m "Related to T123 in PRD"
        ```
  3. Once all the subtasks are marked completed and changes have been committed, mark the **parent task** as completed.
- Stop after each sub‑task and wait for the user's go‑ahead.

## Task List Maintenance

1. **Update the task list as you work:**
   - Mark tasks and subtasks as completed (`[x]`) per the protocol above.
   - Add new tasks as they emerge.

2. **Maintain the "Relevant Files" section:**
   - List every file created or modified.
   - Give each file a one‑line description of its purpose.

## Discord Notification Requirements

**MANDATORY**: Send Discord webhook notifications in the following situations:

1. **When a task is completed:**
   - Include project name/path, task number, and summary of what was accomplished
   - Mention test results and commit hash

2. **When a task fails or requires compromise:**
   - Explain the failure reason clearly
   - Propose alternatives (skip, hardcode, simplify, or reduce scope)
   - Wait for user feedback before proceeding

3. **When suggesting a better approach:**
   - Explain why the alternative approach is recommended
   - Provide clear reasoning and benefits
   - Wait for user approval before changing course

### Discord Webhook Configuration

- **Webhook URL:** `https://discord.com/api/webhooks/1427182963317276743/LA5OmHXKnGgsRlKOFujd2dfIlpD8vUgoefQRev-jCjd-sWseBJrLVgpAiWaUIk0BsD4b`
- **Character Limit:** 1000 characters maximum - summarize appropriately
- **Message Language:** ALL Discord messages MUST be written in Korean (한글)
- **Message Format:** Always include:
  - Project name or path identifier
  - Current task number and description
  - Status or action required
  - Relevant details (commit hash, test results, error summary, etc.)

### Example Discord Message Format

```json
{
  "content": "**[FIRE]** Task 5.0 완료 ✅\n\n**작업:** 증자/감자 현황 API 구현\n**경로:** /Users/idongho/proj/fire\n**테스트:** 84개 통과, 149 assertions\n**커밋:** 12699a1\n\n모든 서브태스크 완료. 다음 지시 대기 중입니다."
}
```

## AI Instructions

When working with task lists, the AI must:

1. Regularly update the task list file after finishing any significant work.
2. Follow the completion protocol:
   - Mark each finished **sub‑task** `[x]`.
   - Mark the **parent task** `[x]` once **all** its subtasks are `[x]`.
3. Add newly discovered tasks.
4. Keep "Relevant Files" accurate and up to date.
5. Before starting work, check which sub‑task is next.
6. After implementing a sub‑task, update the file and then pause for user approval.
7. **ALWAYS send Discord notifications** as specified in the Discord Notification Requirements section above.
8. **Context Preservation:** If context becomes abbreviated during communication (e.g., when reporting in English), reload the task list file, the PRD file, and any other referenced documents using the Read tool before continuing work to ensure full context is maintained and no information is lost.