export async function fetchCourseData(skills) {
  console.log('fetchCourseData called with skills:', skills);
  
  const courseData = skills.map(skill => ({
    skill,
    platforms: [
      {
        name: 'YouTube',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' course')}`
      },
      {
        name: 'Coursera',
        url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`
      },
      {
        name: 'Udemy',
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`
      }
    ]
  }));

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Course data:', courseData);
    return courseData;
  } catch (error) {
    console.error('Error fetching course data:', error);
    return [];
  }
}

