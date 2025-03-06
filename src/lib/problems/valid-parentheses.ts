import { ProblemState, TestCaseTemplate } from '@/stores/runno-store';

// Define the test cases for this problem
const testCases: TestCaseTemplate[] = [
  {
    description: 'Example 1: s = "()"',
    stdin: '',
    expectedOutput: 'true'
  },
  {
    description: 'Example 2: s = "()[]{}"',
    stdin: '',
    expectedOutput: 'true'
  },
  {
    description: 'Example 3: s = "(]"',
    stdin: '',
    expectedOutput: 'false'
  },
  {
    description: 'Example 4: s = "([)]"',
    stdin: '',
    expectedOutput: 'false'
  },
  {
    description: 'Example 5: s = "{[]}"',
    stdin: '',
    expectedOutput: 'true'
  }
];

// Define the problem
export const validParenthesesProblem: ProblemState = {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  difficulty: 'easy',
  description: `
  Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

  An input string is valid if:
  1. Open brackets must be closed by the same type of brackets.
  2. Open brackets must be closed in the correct order.
  3. Every close bracket has a corresponding open bracket of the same type.

  ## Example 1:
  \`\`\`
  Input: s = "()"
  Output: true
  \`\`\`

  ## Example 2:
  \`\`\`
  Input: s = "()[]{}"
  Output: true
  \`\`\`

  ## Example 3:
  \`\`\`
  Input: s = "(]"
  Output: false
  \`\`\`

  ## Example 4:
  \`\`\`
  Input: s = "([)]"
  Output: false
  \`\`\`

  ## Example 5:
  \`\`\`
  Input: s = "{[]}"
  Output: true
  \`\`\`

  ## Constraints:
  - \`1 <= s.length <= 10^4\`
  - \`s\` consists of parentheses only \`'()[]{}'\`.
  `,
  starterCode: {
    python: `def isValid(s):
    # Your code here
    pass

# Example usage
print(isValid("()"))  # Expected: true
print(isValid("()[]{}"))  # Expected: true
print(isValid("(]"))  # Expected: false`,
    quickjs: `function isValid(s) {
    // Your code here
}

// Example usage
console.log(isValid("()"));  // Expected: true
console.log(isValid("()[]{}"));  // Expected: true
console.log(isValid("(]"));  // Expected: false`,
    clangpp: `#include <iostream>
#include <string>
#include <stack>

bool isValid(std::string s) {
    // Your code here
    return false;
}

int main() {
    std::cout << (isValid("()") ? "true" : "false") << std::endl;  // Expected: true
    std::cout << (isValid("()[]{}") ? "true" : "false") << std::endl;  // Expected: true
    std::cout << (isValid("(]") ? "true" : "false") << std::endl;  // Expected: false
    return 0;
}`
  },
  testCases: testCases
}; 