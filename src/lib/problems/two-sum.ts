import { ProblemState, TestCaseTemplate } from '@/stores/runno-store';

// Define the test cases for this problem
const testCases: TestCaseTemplate[] = [
  {
    description: 'Example 1: nums = [2,7,11,15], target = 9',
    stdin: '',
    expectedOutput: '[0, 1]'
  },
  {
    description: 'Example 2: nums = [3,2,4], target = 6',
    stdin: '',
    expectedOutput: '[1, 2]'
  },
  {
    description: 'Example 3: nums = [3,3], target = 6',
    stdin: '',
    expectedOutput: '[0, 1]'
  }
];

// Define the problem
export const twoSumProblem: ProblemState = {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  description: `
  Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

  You may assume that each input would have exactly one solution, and you may not use the same element twice.

  You can return the answer in any order.

  ## Example 1:
  \`\`\`python
  Input: nums = [2,7,11,15], target = 9
  Output: [0,1]
  Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
  \`\`\`
  ## Example 2:

  \`\`\`python
  Input: nums = [3,2,4], target = 6
  Output: [1,2]
  \`\`\`

  ## Example 3:
  \`\`\`python
  Input: nums = [3,3], target = 6
  Output: [0,1]
  \`\`\`

  ## Constraints:

  - \`2 <= nums.length <= 104\`
  - \`-109 <= nums[i] <= 109\`
  - \`-109 <= target <= 109\`
  - \`Only one valid answer exists.\`
  `,
  starterCode: {
    python: `def twoSum(nums, target):
    # Your code here
    pass

# Example usage
print(twoSum([2, 7, 11, 15], 9))`,
    quickjs: `function twoSum(nums, target) {
    // Your code here
}

// Example usage
console.log(twoSum([2, 7, 11, 15], 9));`,
    clangpp: `#include <iostream>
#include <vector>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    // Your code here
    return {};
}

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    std::vector<int> result = twoSum(nums, target);
    
    std::cout << "[" << result[0] << ", " << result[1] << "]" << std::endl;
    return 0;
}`
  },
  testCases: testCases
}; 