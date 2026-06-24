import sys

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the indices
start_grid = -1
end_grid = -1
start_left = -1
end_left = -1
start_right = -1
end_right = -1

for i, line in enumerate(lines):
    if '<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">' in line and start_grid == -1:
        start_grid = i
    if '{/* Left Column - Payment Form & Saved Billers */}' in line and start_left == -1:
        start_left = i
    if '{/* Right Column - Catalog */}' in line and start_right == -1:
        start_right = i

# Find ends
# Left column ends right before Right Column
end_left = start_right - 1

# Right column ends right before end_grid
# Actually end_grid is right before {/* Edit Biller Dialog */}
for i in range(start_right, len(lines)):
    if '{/* Edit Biller Dialog */}' in line:
        end_grid = i - 1
        end_right = end_grid - 1
        break

left_col = lines[start_left:end_left]
# Change left_col span
for i, line in enumerate(left_col):
    if '<div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">' in line:
        left_col[i] = line.replace('lg:col-span-5 xl:col-span-4', 'lg:col-span-6 xl:col-span-6')

right_col = lines[start_right:end_right]
# Change right_col so it doesn't have col-span, just w-full
for i, line in enumerate(right_col):
    if '<div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">' in line:
        right_col[i] = line.replace('lg:col-span-7 xl:col-span-8', 'w-full')

transactions_col = """
        {/* Right Column - Transactions */}
        <div className="flex flex-col gap-6 lg:col-span-6 xl:col-span-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Recent utility payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                <p>No recent transactions found.</p>
              </div>
            </CardContent>
          </Card>
        </div>
""".splitlines(True)

new_content = lines[:start_grid] + right_col + ['\n      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">\n'] + left_col + transactions_col + ['      </div>\n'] + lines[end_grid:]

with open('src/app/(main)/dashboard/ecommerce/page.tsx', 'w') as f:
    f.writelines(new_content)

print("Done")
