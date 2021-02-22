import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({ show: false, msg: "" })

  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`).then(({ data }) => {
      let { rate: { remaining } } = data;
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, 'sorry, you have exeeded your hourlyrate limit!')
      }
    }).catch(err => toggleError(true, err.message))
      .finally(
        () => setLoading(false)
      )
  }

  const searchGithubUser = async (user) => {
    setLoading(true);
    toggleError();
    const response = await axios(`${rootUrl}/users/${user}`)
      .catch(err => console.log(err)
      )

    if (response) {
      setGithubUser(response.data)
      const { login, followers_url } = response.data;


      await Promise.all([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then(result => {
        const [reops, followers] = result;
        setRepos(reops.data);
        setFollowers(followers.data)
      }).catch(err => console.log(err))
    } else {
      toggleError(true, 'there is no user with that username!')
    }
    checkRequest();
    setLoading(false);
  }

  useEffect(() => {
    checkRequest();
  }, [])

  const toggleError = (show = false, msg = '') => {
    setError({ show, msg })
  }

  return <GithubContext.Provider
    value={{
      githubUser, repos, followers,
      requests, error, searchGithubUser,
      loading,
    }}>
    {children}
  </GithubContext.Provider>
}

export { GithubContext, GithubProvider };