'use client';

import styled from 'styled-components';
import Button from '@/atomic/button';
import Dialog from '@/component/atomic/dialog';
import { setAppDialog } from '@/help/setAppDialog';
import { addAlert } from '@/help/addAlert';

export default function Home() {
  const showRandomDialog = () => {
    setAppDialog(
      <Dialog onClose={setAppDialog} open={true} title="random title">
        random content
      </Dialog>,
    );
  };

  const showRandomAlert = () => {
    const randomMsg = 'code: ' + Math.random();
    addAlert(<>{randomMsg}</>);
  };

  return (
    <div>
      <main>
        <AuthorName>author name</AuthorName>
        <Button onClick={showRandomDialog}>click</Button>
        <br />
        <Button onClick={showRandomAlert}>random alert</Button>
      </main>
    </div>
  );
}

const AuthorName = styled.div`
  font-size: 24px;
`;
