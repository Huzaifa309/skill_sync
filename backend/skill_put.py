import csv

def extract_skills():
    skills = []
    with open('skill_relevance.csv', 'r') as file:
        csv_reader = csv.reader(file)
        next(csv_reader)  # Skip header row
        for row in csv_reader:
            if row:  # Check if row is not empty
                skill = row[0].strip()  # Get first column and remove whitespace
                if skill and not skill.startswith('redisgraphblas'):  # Skip Redis GraphBLAS variations
                    skills.append(skill)
    
    # Write skills to file
    with open('skills.txt', 'w') as file:
        for skill in skills:
            file.write(skill + '\n')

if __name__ == "__main__":
    extract_skills()